(module
    (func (export "exported_func")
        (local $x i64)
        (local $scratch i64)
        (i64.const 3)
        (local.set $x)
        (local.get $x)
        (i64.const 1)
        (i64.lt_s)
        (i64.extend_i32_u)
        (i64.const 4294967296)
        (i64.add)
        (i32.wrap_i64)
        (if (result i64)
            (then
                (local.get $x)
            )
            (else 
                (local.get $scratch)
            )
        )
        (local.get $x)
        (i64.const 9)
        (i64.add)
        (local.set $x)
    )
  )