(module
    (func $rec_func (param $x i64)
        (local $y i64)
        (i64.const 5)
        (local.set $y)
        (return)
    )


    (func (export "exported_func")
        (i64.const 3)
        (call $rec_func)
    )
  )